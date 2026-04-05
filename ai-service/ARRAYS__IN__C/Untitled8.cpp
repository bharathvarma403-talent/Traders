//find the reverse of any array using pointer notation of array a[5] = [11,22,33,44,55] output is 55,44,33,22,11
#include<stdio.h>
int main(){
	int i;
	int a[5] = {11,22,33,44,55};
	int *p;
	 p = &a[4];
	 for(i=0;i<5;i++)
	 {
	 	printf("%d",*(p-i));
	 }
}
