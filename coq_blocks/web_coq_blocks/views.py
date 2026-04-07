from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from antlr import COQMain 
from block_classes import *

def index(request):
    return render(request, 'web_coq_blocks/index.html', {})

@api_view(['POST'])
def new_definition(request):
    
    try:
        text_data = request.body.decode('utf-8')

        if not text_data:
            return Response({"error": "Empty input data"}, status=status.HTTP_400_BAD_REQUEST)

        print("Processing Coq data...")

        # Parse the Coq code using the ANTLR parser
        parsed_objects = COQMain.process_coq_code(text_data)

        # Serialization to JSON
        json_data = [obj.to_dict() for obj in parsed_objects]

        return Response(json_data, status=status.HTTP_200_OK)

    except Exception as e:
        msg = str(e)
        if not msg:
            msg = f"Unexpected error: {type(e).__name__}"
        return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)
